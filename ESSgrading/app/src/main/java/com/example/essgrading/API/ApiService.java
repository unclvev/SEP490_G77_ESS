package com.example.essgrading.API;

import com.example.essgrading.Model.LoginRequest;
import com.example.essgrading.Model.LoginResponse;
import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.Model.TestModel;

import java.util.List;

import okhttp3.MultipartBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.Path;

public interface ApiService {

    @GET("api/Analysis/{examId}")
    Call<List<ScoreModel>> getScoreReport(@Path("examId") int examId);

    @GET("api/Exam/allexam")
    Call<List<TestModel>> getAllExam();

    @GET("api/Exam/accid/{accId}")
    Call<List<TestModel>> getAllExamByAccId(@Path("accId") long accId);

    @POST("api/Login")
    Call<LoginResponse> login(@Body LoginRequest loginRequest);

    @Multipart
    @POST("scan-essay")
    Call<ResponseBody> uploadImage(@Part MultipartBody.Part image);
}
