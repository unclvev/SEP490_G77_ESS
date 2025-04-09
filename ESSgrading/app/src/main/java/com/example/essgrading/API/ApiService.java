package com.example.essgrading.API;

import com.example.essgrading.Model.ScoreModel;
import com.example.essgrading.Model.TestModel;

import java.util.List;

import okhttp3.MultipartBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
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

    @Multipart
    @POST("api/upload/image") //sửa endpoint theo đúng URL backend nhận ảnh
    Call<ResponseBody> uploadImage(@Part MultipartBody.Part image);
}
