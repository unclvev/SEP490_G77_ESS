package com.example.essgrading.Model;

import com.google.gson.annotations.SerializedName;

public class ScoreModel {

    @SerializedName("name")
    private String studentName;

    @SerializedName("studentId")
    private String studentId;

    @SerializedName("score")
    private String score;

    @SerializedName("examCode")
    private String examCode;

    @SerializedName("class")  // map lại do 'class' là từ khóa Java
    private String className;

    @SerializedName("time")
    private String time;

    public ScoreModel(String studentName, String studentId, String score, String examCode, String className, String time) {
        this.studentName = studentName;
        this.studentId = studentId;
        this.score = score;
        this.examCode = examCode;
        this.className = className;
        this.time = time;
    }

    public String getStudentName() { return studentName; }
    public String getStudentId() { return studentId; }
    public String getScore() { return score; }
    public String getExamCode() { return examCode; }
    public String getClassName() { return className; }
    public String getTime() { return time; }
}


