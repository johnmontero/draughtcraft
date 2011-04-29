from beerparts.controllers.root import RootController

import beerparts

# Server Specific Configurations
server = {
    'port' : '8080',
    'host' : '0.0.0.0'
}

# Pecan Application Configurations
app = {
    'root'          : RootController(),
    'modules'       : [beerparts],
    'static_root'   : '%(confdir)s/public', 
    'template_path' : '%(confdir)s/beerparts/templates',
    'reload'        : True,
    'debug'         : True,
    'logging'       : False,
    'errors'        : {
        '404'            : '/error/404',
        '__force_dict__' : True
    }
}

# Custom Configurations must be in Python dictionary format::
#
# foo = {'bar':'baz'}
# 
# All configurations are accessible at::
# pecan.conf
