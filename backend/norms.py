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