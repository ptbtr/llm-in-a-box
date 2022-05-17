from flask import Flask


def create_app() -> Flask:
    app = Flask(__name__)

    from server import views
    app.register_blueprint(views.server)

    return app
