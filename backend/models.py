from pydantic import BaseModel


class Plot(BaseModel):
    width: int
    height: int


class House(BaseModel):
    x: int
    y: int
    width: int
    height: int


class PlacementRequest(BaseModel):
    plot: Plot
    house: House