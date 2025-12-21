# norms.py
class NormViolation(Exception):
    def __init__(self, message, rule):
        self.message = message
        self.rule = rule

def check_house(plot, house):
# отступ от границ ≥ 3 м (условно 30px)
    min_dist = 30
    if house.x < min_dist:
        raise NormViolation(
        "Дом слишком близко к левой границе",
        "СП 53.13330.2019 — ≥ 3 м"
        )
    if house.y < min_dist:
        raise NormViolation(
        "Дом слишком близко к верхней границе",
        "СП 53.13330.2019 — ≥ 3 м"
        )


    if house.x + house.width > plot.width - min_dist:
        raise NormViolation(
        "Дом слишком близко к правой границе",
        "СП 53.13330.2019 — ≥ 3 м"
        )


    if house.y + house.height > plot.height - min_dist:
        raise NormViolation(
        "Дом слишком близко к нижней границе",
        "СП 53.13330.2019 — ≥ 3 м"
        )
        
def check_tree(plot, tree):
    min_dist = 10 
    tree_width = 20
    tree_height = 20

    # Проверка левой границы
    if tree.x < min_dist:
        raise NormViolation(
            "Дерево слишком близко к левой границе",
            "СНиП 30-02-97 — ≥ 1 м"
        )
    
    # Проверка верхней границы
    if tree.y < min_dist:
        raise NormViolation(
            "Дерево слишком близко к верхней границе",
            "СНиП 30-02-97 — ≥ 1 м"
        )

    # Проверка правой границы
    if tree.x + tree_width > plot.width - min_dist:
        raise NormViolation(
            "Дерево слишком близко к правой границе",
            "СНиП 30-02-97 — ≥ 1 м"
        )

    # Проверка нижней границы
    if tree.y + tree_height > plot.height - min_dist:
        raise NormViolation(
            "Дерево слишком близко к нижней границе",
            "СНиП 30-02-97 — ≥ 1 м"
        )

def check_garage(plot, garage):
    # Для хозпостроек отступ обычно 1 метр 
    min_dist = 10 
    
    # Пусть гараж будет 4x6 метров (40x60 единиц)
    g_width = garage.width
    g_height = garage.height

    if garage.x < min_dist:
        raise NormViolation("Гараж слишком близко к левой границе", "СНиП 30-02-97 — ≥ 1 м")
    
    if garage.y < min_dist:
        raise NormViolation("Гараж слишком близко к верхней границе", "СНиП 30-02-97 — ≥ 1 м")

    if garage.x + g_width > plot.width - min_dist:
        raise NormViolation("Гараж слишком близко к правой границе", "СНиП 30-02-97 — ≥ 1 м")

    if garage.y + g_height > plot.height - min_dist:
        raise NormViolation("Гараж слишком близко к нижней границе", "СНиП 30-02-97 — ≥ 1 м")