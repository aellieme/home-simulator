from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from models import PlacementRequest
from pydantic import BaseModel
from norms import check_house, NormViolation, check_tree, check_garage

app = FastAPI()
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
#     )

# @app.post("/check-house")
# def check_house_endpoint(req: PlacementRequest):
#     try:
#         check_house(req.plot, req.house)
#         return {"ok": True}
#     except NormViolation as e:
#         return {
#         "ok": False,
#         "message": e.message,
#         "rule": e.rule
#         }



# Настройка CORS (чтобы React с 5173 мог стучаться на 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене лучше указать конкретный домен
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Описываем структуру данных, которая приходит от api.js ---
# Pydantic сам превратит JSON в объекты Python

class PlotModel(BaseModel):
    width: float
    height: float

class HouseModel(BaseModel):
    x: float
    y: float
    width: float
    height: float

class CheckRequest(BaseModel):
    plot: PlotModel
    house: HouseModel
    
class TreeRequestModel(BaseModel):
    x: float
    y: float 

class CheckTreeRequest(BaseModel):
    plot: PlotModel
    tree: TreeRequestModel

class GarageRequest(BaseModel):
    plot: PlotModel
    garage: HouseModel # Используем ту же структуру, что у дома (x,y,w,h)

@app.post("/check-house")
async def check_house_endpoint(data: CheckRequest):
    """
    Принимает JSON вида:
    {
      "plot": {"width": 800, "height": 800},
      "house": {"x": 50, "y": 50, "width": 100, "height": 100}
    }
    """
    try:
        # data.plot и data.house — это уже готовые объекты с атрибутами x, y, width...
        # Просто передаем их в вашу логику проверки
        check_house(data.plot, data.house)
        
        # Если функция check_house выполнилась без ошибок:
        return {
            "success": True, 
            "message": "Размещение соответствует нормам"
        }

    except NormViolation as e:
        # Если ваша логика нашла нарушение и выкинула ошибку:
        return {
            "success": False,
            "violation": True,     # Флаг для фронтенда
            "message": e.message,  # Текст ошибки ("Дом слишком близко...")
            "rule": e.rule         # Ссылка на норму ("СП 53...")
        }
    except Exception as e:
        # На случай непредвиденных ошибок в коде
        return {
            "success": False,
            "message": f"Внутренняя ошибка сервера: {str(e)}"
        }

@app.post("/check-tree")
async def check_tree_endpoint(data: CheckTreeRequest):
    try:
        # Создаем объект дерева с координатами + добавляем фиктивные размеры для логики
        class TreeObj:
            x = data.tree.x
            y = data.tree.y
            width = 20 # Фиксированный размер
            height = 20
        
        check_tree(data.plot, TreeObj)
        
        return {"violation": False, "message": "OK"}

    except NormViolation as e:
        return {
            "violation": True,
            "message": e.message,
            "rule": e.rule
        }
        
@app.post("/check-garage")
async def check_garage_endpoint(data: GarageRequest):
    try:
        check_garage(data.plot, data.garage)
        return {"violation": False, "message": "OK"}
    except NormViolation as e:
        return {"violation": True, "message": e.message, "rule": e.rule}