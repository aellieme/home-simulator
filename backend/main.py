from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import PlacementRequest
from norms import check_house, NormViolation


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    )


@app.post("/check-house")
def check_house_endpoint(req: PlacementRequest):
    try:
        check_house(req.plot, req.house)
        return {"ok": True}
    except NormViolation as e:
        return {
        "ok": False,
        "message": e.message,
        "rule": e.rule
        }