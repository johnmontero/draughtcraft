from elixir import (
    Entity, Field, Unicode, Interval, Float, Enum, using_options,
    OneToMany, ManyToOne
)
from beerparts.lib.units import UnitConvert, UNITS

class Recipe(Entity):

    name                = Field(Unicode(256))

    additions           = OneToMany('RecipeAddition', inverse='recipe')

    def _partition(self, additions):
        p = {}
        for a in additions:
            p.setdefault(a.ingredient.__class__, []).append(a)
        return p

    @property
    def mash(self):
        return self._partition([a for a in self.additions if a.use == 'MASH'])

    @property
    def boil(self):
        return self._partition([a for a in self.additions if a.use in (
            'FIRST WORT',
            'BOIL',
            'POST-BOIL',
            'FLAME OUT'
        )])

    @property
    def fermentation(self):
        return self._partition([a for a in self.additions if a.use in (
            'PRIMARY',
            'SECONDARY'
        )])


class RecipeAddition(Entity):

    USES = [
        'MASH',
        'FIRST WORT',
        'BOIL',
        'POST-BOIL',
        'FLAME OUT',
        'PRIMARY',
        'SECONDARY'
    ]

    using_options(inheritance='multi', polymorphic=True)

    amount              = Field(Float)
    unit                = Field(Enum(*UNITS))
    use                 = Field(Enum(*USES))
    duration            = Field(Interval)

    recipe              = ManyToOne('Recipe', inverse='additions')
    fermentable         = ManyToOne('Fermentable', inverse='additions')
    hop                 = ManyToOne('Hop', inverse='additions')
    yeast               = ManyToOne('Yeast', inverse='additions')

    @property
    def printable_amount(self):
        return UnitConvert.to_str(self.amount, self.unit)

    @property
    def ingredient(self):
        for ingredient in ('fermentable', 'hop', 'yeast'):
            match = getattr(self, ingredient, None)
            if match is not None:
                return match


class HopAddition(RecipeAddition):


    FORMS = [
        'LEAF',
        'PELLET',
        'PLUG'
    ]

    form                = Field(Enum(*FORMS))
    alpha_acid          = Field(Float())

    using_options(inheritance='multi', polymorphic=True)
