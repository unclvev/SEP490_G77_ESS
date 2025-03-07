package com.example.essgrading.Model;

public class ScoreModel {
    private String studentName;
    private String studentId;
    private double score;

    public ScoreModel(String studentName, String studentId, double score) {
        this.studentName = studentName;
        this.studentId = studentId;
        this.score = score;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getStudentId() {
        return studentId;
    }

    public double getScore() {
        return score;
    }
}
