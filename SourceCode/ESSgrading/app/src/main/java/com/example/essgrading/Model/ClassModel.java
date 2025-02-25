package com.example.essgrading.Model;

public class ClassModel {
    private String classCode;
    private String studentCount;
    private String createdDate;

    public ClassModel(String classCode, String studentCount, String createdDate) {
        this.classCode = classCode;
        this.studentCount = studentCount;
        this.createdDate = createdDate;
    }

    public String getClassCode() {
        return classCode;
    }

    public String getStudentCount() {
        return studentCount;
    }

    public String getCreatedDate() {
        return createdDate;
    }
}
