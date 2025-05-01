package com.example.essgrading.API;

import com.example.essgrading.Activity.Authentication.TokenResponse;
import com.example.essgrading.Model.LoginRequest;
import com.example.essgrading.Model.LoginResponse;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.Model.TestModel;

import java.util.List;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.Path;

public interface ApiService {

    @POST("Login/refresh")
    Call<TokenResponse> refreshToken(@Body String refreshToken);
    @GET("api/Analysis/{examId}")
    Call<List<ScoreModel>> getScoreReport(@Path("examId") int examId);

    @GET("api/Exam/allexam")
    Call<List<TestModel>> getAllExam();

    @GET("api/Exam/accid/{accId}")
    Call<List<TestModel>> getAllExamByAccId(@Path("accId") long accId);

    @POST("api/Login")
    Call<LoginResponse> login(@Body LoginRequest loginRequest);

    @Multipart
    @POST("essay/scan")
    Call<ResponseBody> uploadEssay(
            @Part MultipartBody.Part image,
            @Part("type") RequestBody type,
            @retrofit2.http.Query("exam_id") String examId
    );

    @Multipart
    @POST("mcq/detect")
    Call<ResponseBody> uploadMCQ(
            @Part MultipartBody.Part file,
            @Part("exam_id") RequestBody examIdPart
    );
}
