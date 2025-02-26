package com.example.essgrading.Model;

import java.util.List;

public class TestModel {
    private String title;
    private String classCode; // Đổi tên từ "code" thành "classCode"
    private String questionCount;
    private String date;
    private List<String> exCodes; // Thêm danh sách mã đề

    public TestModel(String title, String classCode, String questionCount, String date, List<String> exCodes) {
        this.title = title;
        this.classCode = classCode;
        this.questionCount = questionCount;
        this.date = date;
        this.exCodes = exCodes;
    }

    public String getTitle() {
        return title;
    }

    public String getClassCode() {
        return classCode;
    }

    public String getQuestionCount() {
        return questionCount;
    }

    public String getDate() {
        return date;
    }

    public List<String> getExCodes() {
        return exCodes;
    }
}
