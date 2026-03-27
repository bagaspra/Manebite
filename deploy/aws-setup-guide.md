# AWS Deployment Guide — Shadowing Queue

## Prasyarat
- AWS CLI terinstall & dikonfigurasi (`aws configure`)
- Key pair EC2 sudah dibuat di region yang digunakan
- Domain tersedia (untuk HTTPS via ACM + Route 53)

---

## STEP 1 — VPC & Subnets

Gunakan default VPC. Buat subnet tambahan untuk RDS (butuh minimal 2 AZ):

```bash
# Cek default VPC
aws ec2 describe-vpcs --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' --output text
# Simpan: VPC_ID=vpc-xxxxxxxxx

# Buat 2 private subnets untuk RDS di AZ berbeda
aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 172.31.48.0/20 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id $VPC_ID \
  --cidr-block 172.31.64.0/20 --availability-zone us-east-1b

# Buat DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name shadowing-subnet-group \
  --db-subnet-group-description "Shadowing Queue RDS subnets" \
  --subnet-ids <private-subnet-1-id> <private-subnet-2-id>
```

---

## STEP 2 — Security Groups

```bash
# SG untuk ALB
aws ec2 create-security-group \
  --group-name shadowing-alb \
  --description "Shadowing Queue ALB" \
  --vpc-id $VPC_ID
# Simpan: ALB_SG_ID=sg-xxxxxxxxx

aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# SG untuk EC2
aws ec2 create-security-group \
  --group-name shadowing-ec2 \
  --description "Shadowing Queue EC2" \
  --vpc-id $VPC_ID
# Simpan: EC2_SG_ID=sg-xxxxxxxxx

aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
  --protocol tcp --port 80 --source-group $ALB_SG_ID
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
  --protocol tcp --port 22 --cidr <YOUR_IP>/32

# SG untuk RDS
aws ec2 create-security-group \
  --group-name shadowing-rds \
  --description "Shadowing Queue RDS" \
  --vpc-id $VPC_ID
# Simpan: RDS_SG_ID=sg-xxxxxxxxx

aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID \
  --protocol tcp --port 5432 --source-group $EC2_SG_ID
```

---

## STEP 3 — RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier shadowing-queue-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.3 \
  --master-username shadowing \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --vpc-security-group-ids $RDS_SG_ID \
  --db-subnet-group-name shadowing-subnet-group \
  --db-name shadowing_queue \
  --no-publicly-accessible \
  --backup-retention-period 7
```

Tunggu ~5 menit hingga status `available`. Dapatkan endpoint:

```bash
aws rds describe-db-instances \
  --db-instance-identifier shadowing-queue-db \
  --query 'DBInstances[0].Endpoint.Address' --output text
# Simpan: RDS_ENDPOINT=shadowing-queue-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
```

---

## STEP 4 — EC2 Instance

Cari AMI Ubuntu 24.04 terbaru di region kamu:

```bash
aws ec2 describe-images \
  --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" \
  --query 'sort_by(Images,&CreationDate)[-1].ImageId' --output text
# Simpan: AMI_ID=ami-xxxxxxxxx
```

Launch instance:

```bash
aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.micro \
  --key-name <KEY_PAIR_NAME> \
  --security-group-ids $EC2_SG_ID \
  --subnet-id <PUBLIC_SUBNET_ID> \
  --associate-public-ip-address \
  --user-data file://deploy/ec2-userdata.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=shadowing-queue}]'
# Simpan: INSTANCE_ID=i-xxxxxxxxx
```

---

## STEP 5 — Application Load Balancer

```bash
# Buat ALB
aws elbv2 create-load-balancer \
  --name shadowing-queue-alb \
  --subnets <public-subnet-1-id> <public-subnet-2-id> \
  --security-groups $ALB_SG_ID
# Simpan: ALB_ARN dan ALB_DNS_NAME dari output

# Buat target group
aws elbv2 create-target-group \
  --name shadowing-queue-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --health-check-path /api/health
# Simpan: TG_ARN

# Register EC2 ke target group
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID

# Listener HTTP → redirect ke HTTPS
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"

# Listener HTTPS → forward ke target group (butuh ACM cert dulu — lihat STEP 6)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS --port 443 \
  --certificates CertificateArn=<ACM_CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

---

## STEP 6 — ACM Certificate

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names "*.yourdomain.com" \
  --validation-method DNS \
  --region us-east-1
# Simpan: CERT_ARN
```

Tambahkan CNAME record yang ditampilkan di output ke DNS provider kamu.
Tunggu status `ISSUED` (~5 menit setelah DNS propagates).

---

## STEP 7 — Route 53 DNS

```bash
# Jika domain di Route 53:
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name yourdomain.com \
  --query 'HostedZones[0].Id' --output text | cut -d/ -f3)

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "<ALB_HOSTED_ZONE_ID>",
          "DNSName": "<ALB_DNS_NAME>",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

---

## STEP 8 — Environment Variables di EC2

SSH ke instance:

```bash
ssh -i <KEY_PAIR>.pem ubuntu@<EC2_PUBLIC_IP>
```

Buat `/app/backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://shadowing:<PASSWORD>@<RDS_ENDPOINT>:5432/shadowing_queue
SECRET_KEY=<GENERATE_WITH: openssl rand -hex 32>
```

Buat `/app/frontend/.env.local`:

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<GENERATE_WITH: openssl rand -hex 32>
API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
GOOGLE_CLIENT_ID=<FROM_GOOGLE_CLOUD_CONSOLE>
GOOGLE_CLIENT_SECRET=<FROM_GOOGLE_CLOUD_CONSOLE>
```

---

## STEP 9 — Database Migration

```bash
cd /app/backend
source .venv/bin/activate
alembic upgrade head
```

---

## STEP 10 — Verify Checklist

- [ ] EC2 instance running, bisa SSH masuk
- [ ] `http://<EC2_PUBLIC_IP>` → Next.js frontend muncul
- [ ] `http://<EC2_PUBLIC_IP>/api/health` → `{"status":"ok"}`
- [ ] `psql -h $RDS_ENDPOINT -U shadowing shadowing_queue` → connect berhasil
- [ ] `alembic current` → menunjukkan `head`
- [ ] ALB health check → `healthy` di console
- [ ] `https://yourdomain.com` → SSL valid (gembok hijau)
- [ ] Submit YouTube URL dari production → data tersimpan di RDS
- [ ] `pm2 status` → semua proses `online`
- [ ] Reboot EC2 → `pm2 list` semua proses kembali `online`

---

## Troubleshooting

**502 Bad Gateway dari ALB**: EC2 belum ready atau PM2 belum start. Cek `pm2 list` dan `sudo systemctl status nginx`.

**Frontend tidak bisa hit backend**: Pastikan `NEXT_PUBLIC_API_URL` mengarah ke `https://yourdomain.com/api` dan nginx meneruskan `/api/` ke port 8000.

**Database connection refused**: Cek Security Group RDS — pastikan EC2's SG diizinkan port 5432.

**pm2 tidak auto-start setelah reboot**: Jalankan ulang `pm2 startup systemd -u ubuntu --hp /home/ubuntu` lalu `pm2 save`.
