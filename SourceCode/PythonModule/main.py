from flask import Flask
from flasgger import Swagger
from ScanStudentAnswer import mcq
from ExtractEssayInfor import essay

app = Flask(__name__)
swagger = Swagger(app)

# Đăng ký 2 blueprint
app.register_blueprint(mcq)
app.register_blueprint(essay)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
