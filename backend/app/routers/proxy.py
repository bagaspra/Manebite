import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/proxy", tags=["proxy"])

JISHO_API = "https://jisho.org/api/v1/search/words"


@router.get("/jisho")
async def proxy_jisho(keyword: str = Query(..., min_length=1)):
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(JISHO_API, params={"keyword": keyword})
            resp.raise_for_status()
            return resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Jisho API timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Jisho API error")
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to reach Jisho API")
