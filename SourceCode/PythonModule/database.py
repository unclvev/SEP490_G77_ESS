import pyodbc

def get_db_connection():
    conn = pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=LAPTOP-KMPJH3OK\\SQLEXPRESS;'
        'DATABASE=ess_db_v11;'
        'UID=sa;'
        'PWD=123;'
        'TrustServerCertificate=Yes;'
        'Encrypt=No;'
    )
    return conn
