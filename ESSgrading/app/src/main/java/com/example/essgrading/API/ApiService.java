package com.example.essgrading.API;

import com.example.essgrading.Model.ScoreModel;

import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

public interface ApiService {
    @GET("api/Analysis/{examId}")
    Call<List<ScoreModel>> getScoreReport(@Path("examId") int examId);
}
