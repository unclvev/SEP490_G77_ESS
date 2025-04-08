package com.example.essgrading.Model;

import com.google.gson.annotations.SerializedName;

import java.util.List;

public class TestModel {
    @SerializedName("examId")
    private String id;
    @SerializedName("examname")
    private String title;
    @SerializedName("classname")
    private String classCode; // Đổi tên từ "code" thành "classCode"
    private String testType;
    @SerializedName("createdate")
    private String date;
    private List<String> exCodes; // Thêm danh sách mã đề

    public TestModel(String id,String title, String classCode, String testType, String date, List<String> exCodes) {
        this.id = id;
        this.title = title;
        this.classCode = classCode;
        this.testType = testType;
        this.date = date;
        this.exCodes = exCodes;
    }

    public String getId() {
        return id;
    }
    public String getTitle() {
        return title;
    }

    public String getClassCode() {
        return classCode;
    }

    public String getTestType() {
        return testType;
    }

    public String getDate() {
        return date;
    }

    public List<String> getExCodes() {
        return exCodes;
    }
}
