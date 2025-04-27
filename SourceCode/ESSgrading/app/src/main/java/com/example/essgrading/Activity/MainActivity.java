package com.example.essgrading.Activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;

import com.example.essgrading.Activity.Test.TestListActivity;
import com.example.essgrading.R;

public class MainActivity extends BaseActivity {

    private Button btnMultipleChoice, btnEssay;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Thiết lập Drawer
        setupDrawer();
        setHeaderTitle("Trang chủ");

        btnMultipleChoice = findViewById(R.id.btnMultipleChoice);

        btnMultipleChoice.setOnClickListener(v ->{
            Intent intent = new Intent(MainActivity.this, TestListActivity.class);
            startActivity(intent);
        });
    }
}
