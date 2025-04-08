package com.example.essgrading.API;

import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.Model.TestModel;

import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

public interface ApiService {
    @GET("api/Analysis/{examId}")
    Call<List<ScoreModel>> getScoreReport(@Path("examId") int examId);

    @GET("api/Exam/allexam")
    Call<List<TestModel>> getAllExam();
}
