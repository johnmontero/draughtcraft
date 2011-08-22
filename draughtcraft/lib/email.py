from pecan              import conf
from pecan.templating   import RendererFactory
from postmark           import PMMail as Message
from mako               import exceptions


class EmailTemplate(object):
    """
    A helper used to load file-based email templates and generate their
    text/html and text/plain representations.

    Can be passed a string template path relative to the app's template root,
    e.g., templates/emails/signup

    In this example, EmailTemplate will attempt to find a matching file for:

    * templates/email/signup.html
    * templates/email/signup.txt
    
    ...for generating both an HTML and plain/text version of the email.
    """

    __html_wrap__ = u'''
        <html>
        <body bgcolor="#ffffff" link="#0099cc" alink="#0099cc" vlink="#0099cc" leftmargin="0" topmargin="0" style="padding: 15px; font-family: Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.3em; text-align: left;">
            %s
        </body>
        </html>
    '''.strip()

    def __init__(self, template_file, template_path):
        self.template_file = template_file
        self.template_path = template_path
        self.renderers = RendererFactory()

    def __render__(self, fmt, ns):
        template_file = '%s.%s' % (self.template_file, fmt)
        try:
            return self.renderers.get('mako', self.template_path).render(
                template_file,
                ns
            )
        except exceptions.TopLevelLookupException:
            pass # This will cause the `__render__` call to return `None`

    def html(self, ns):
        body = self.__render__('html', ns)
        if body:
            return self.__html_wrap__ % body

    def text(self, ns):
        return self.__render__('txt', ns)


def send(to, template, subject, ns={}, sender='notify@draughtcraft.com',
        cc=[], bcc=[]):
    """
    Used to send a transactional email through Postmark's API.

    to          - the recipient's email address.
    template    - a string template path (relative to the app's template root)
    subject     - the subject of the email
    ns          - the template namespace used to render the email content
    sender      - the sender fo the email
    cc          - a list of cc recipients
    bcc         - a list of bcc recipients
    """

    email = EmailTemplate(template, '%s/emails' % conf.app.template_path)

    Message(
        api_key     = conf.postmark.api_key,
        to          = to,
        cc          = cc,
        bcc         = bcc,
        subject     = subject,
        sender      = sender,
        html_body   = email.html(ns),
        text_body   = email.text(ns),
    ).send()