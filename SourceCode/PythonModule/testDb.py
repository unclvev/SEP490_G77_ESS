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

def fetch_all_exams():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        SELECT exam_id, examname, createdate, acc_id, examdata, grade, subject, classname, exam_type
        FROM Exam
        """
        cursor.execute(query)

        exams = []
        columns = [column[0] for column in cursor.description]  # Lấy tên cột
        
        for row in cursor.fetchall():
            exam = dict(zip(columns, row))  # map từng dòng thành dict
            exams.append(exam)
        
        conn.close()
        return exams

    except Exception as e:
        print("❌ Error while fetching exams:", str(e))
        return None

if __name__ == "__main__":
    exams = fetch_all_exams()
    if exams:
        for exam in exams:
            print(exam)
    else:
        print("No exams found or error occurred.")
