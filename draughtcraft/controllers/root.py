from pecan                              import expose, request, redirect
from draughtcraft                       import model
from draughtcraft.lib.auth              import save_user_session, remove_user_session
from draughtcraft.lib.schemas.login     import LoginSchema

from error      import ErrorController
from recipes    import RecipesController
from signup     import SignupController

class RootController(object):

    @expose('index.html')
    def index(self):
        return dict()

    @expose(
        generic     = True,
        template    = 'login.html'
    )
    def login(self):
        return dict()

    @login.when(
        method          = 'POST',
        schema          = LoginSchema(),
        htmlfill        = dict(auto_insert_errors = True, prefix_error = True),
        error_handler   = lambda: request.path
    )
    def _post_login(self, username, password):
        save_user_session(model.User.get_by(username=username))
        redirect('/')

    @expose()
    def logout(self):
        remove_user_session()
        redirect('/')

    error   = ErrorController()
    recipes = RecipesController()
    signup  = SignupController()
