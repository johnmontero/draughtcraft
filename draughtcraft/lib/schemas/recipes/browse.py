from formencode                     import validators
from draughtcraft.lib.schemas.base  import FilteredSchema, ModelObject
from draughtcraft                   import model


class RecipeSearchSchema(FilteredSchema):
    """
    This schema is for recipe search queries
    """
    page        = validators.Int(if_empty=1, if_missing=1)
    search      = validators.String(if_empty=None)
    color       = validators.OneOf(['light', 'amber', 'brown', 'dark'], if_empty=None)
    style       = ModelObject(model.Style, if_empty=None)

    mash        = validators.StringBool()
    minimash    = validators.StringBool()
    extract     = validators.StringBool()
