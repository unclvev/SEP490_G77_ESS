package com.example.essgrading.Model;

public class StudentModel {
    private String name;
    private String studentId;

    public StudentModel(String name, String studentId) {
        this.name = name;
        this.studentId = studentId;
    }

    public String getName() {
        return name;
    }

    public String getStudentId() {
        return studentId;
    }
}
