# norms.py
class NormViolation(Exception):
    def __init__(self, message, rule):
        self.message = message
        self.rule = rule

def is_overlapping(x1, y1, w1, h1, x2, y2, w2, h2):
    """Проверка пересечения двух прямоугольников (AABB)"""
    return not (x1 + w1 <= x2 or x2 + w2 <= x1 or y1 + h1 <= y2 or y2 + h2 <= y1)

def check_collisions(new_item, others, name):
    """Проверяет пересечение нового объекта со всеми существующими"""
    for obj in others:
        if is_overlapping(new_item.x, new_item.y, new_item.width, new_item.height,
                          obj.x, obj.y, obj.width, obj.height):
            raise NormViolation(
                f"Нельзя поставить {name} здесь: место занято другим объектом",
                "Объекты не должны пересекаться"
            )

def check_house(plot, house, others=[]):
    # Твои проверки границ
    min_dist = 30
    if house.x < min_dist:
        raise NormViolation("Дом слишком близко к левой границе", "СП 53.13330.2019 — ≥ 3 м")
    if house.y < min_dist:
        raise NormViolation("Дом слишком близко к верхней границе", "СП 53.13330.2019 — ≥ 3 м")
    if house.x + house.width > plot.width - min_dist:
        raise NormViolation("Дом слишком близко к правой границе", "СП 53.13330.2019 — ≥ 3 м")
    if house.y + house.height > plot.height - min_dist:
        raise NormViolation("Дом слишком близко к нижней границе", "СП 53.13330.2019 — ≥ 3 м")
    
    # Проверка наложений
    check_collisions(house, others, "дом")

def check_tree(plot, tree, others=[]):
    min_dist = 10 
    if tree.x < min_dist:
        raise NormViolation("Дерево слишком близко к левой границе", "СНиП 53.13330.2019 — ≥ 2 ")
    if tree.y < min_dist:
        raise NormViolation("Дерево слишком близко к верхней границе", "СНиП 53.13330.2019 — ≥ 2 ")
    if tree.x + tree.width > plot.width - min_dist:
        raise NormViolation("Дерево слишком близко к правой границе", "СНиП 53.13330.2019 — ≥ 2 ")
    if tree.y + tree.height > plot.height - min_dist:
        raise NormViolation("Дерево слишком близко к нижней границе", "СНиП 53.13330.2019 — ≥ 2 ")
    
    check_collisions(tree, others, "дерево")

def check_garage(plot, garage, others=[]):
    min_dist = 10 
    if garage.x < min_dist:
        raise NormViolation("Гараж слишком близко к левой границе", "СП 42.13330, пункт 7.1 — ≥ 1 м")
    if garage.y < min_dist:
        raise NormViolation("Гараж слишком близко к верхней границе", "СП 42.13330, пункт 7.1 — ≥ 1 м")
    if garage.x + garage.width > plot.width - min_dist:
        raise NormViolation("Гараж слишком близко к правой границе", "СП 42.13330, пункт 7.1 — ≥ 1 м")
    if garage.y + garage.height > plot.height - min_dist:
        raise NormViolation("Гараж слишком близко к нижней границе", "СП 42.13330, пункт 7.1 — ≥ 1 м")
    
    check_collisions(garage, others, "гараж")

def check_garden_bed(plot, bed, others=[]):
    min_dist = 1
    if bed.x < min_dist:
        raise NormViolation("Грядка слишком близко к левой границе", "")
    if bed.y < min_dist:
        raise NormViolation("Грядка слишком близко к верхней границе", "")
    if bed.x + bed.width > plot.width - min_dist:
        raise NormViolation("Грядка слишком близко к правой границе", "")
    if bed.y + bed.height > plot.height - min_dist:
        raise NormViolation("Грядка слишком близко к нижней границе", "")
    
    check_collisions(bed, others, "грядка")