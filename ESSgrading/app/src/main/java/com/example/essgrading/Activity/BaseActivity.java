package com.example.essgrading.Activity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import com.example.essgrading.Activity.Class.ClassListActivity;
import com.example.essgrading.Activity.Test.TestListActivity;
import com.example.essgrading.R;
import com.google.android.material.navigation.NavigationView;

public class BaseActivity extends AppCompatActivity {

    protected DrawerLayout drawerLayout;
    protected NavigationView navigationView;
    protected TextView headerTitle;
    protected TextView userEmail; // Thêm biến cho email

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    protected void setupDrawer() {
        drawerLayout = findViewById(R.id.drawerLayout);
        navigationView = findViewById(R.id.navigationView);
        headerTitle = findViewById(R.id.headerTitle);

        if (drawerLayout == null || navigationView == null) {
            return;
        }

        // Lấy email từ SharedPreferences và cập nhật lên header
        updateHeaderEmail();

        View menuIcon = findViewById(R.id.menuIcon);
        if (menuIcon != null) {
            menuIcon.setOnClickListener(v -> {
                if (drawerLayout != null) {
                    drawerLayout.openDrawer(GravityCompat.START);
                }
            });
        }

        navigationView.setNavigationItemSelectedListener(item -> {
            int id = item.getItemId();

            if (id == R.id.menu_exam_storage) {
                Intent intent = new Intent(BaseActivity.this, TestListActivity.class);
                startActivity(intent);
            } else if (id == R.id.menu_classes) {
                Intent intent = new Intent(BaseActivity.this, ClassListActivity.class);
                startActivity(intent);
            }

            drawerLayout.closeDrawer(GravityCompat.START);
            return true;
        });

        drawerLayout.addDrawerListener(new ActionBarDrawerToggle(
                this, drawerLayout, R.string.open_drawer, R.string.close_drawer));

        // Xử lý sự kiện cho Footer
        setupFooter();
    }

    protected void setHeaderTitle(String title) {
        if (headerTitle != null) {
            headerTitle.setText(title);
        }
    }

    @Override
    public void onBackPressed() {
        if (drawerLayout != null && drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    // Cập nhật email trong header
    private void updateHeaderEmail() {
        View headerView = navigationView.getHeaderView(0);
        userEmail = headerView.findViewById(R.id.userEmail);

        SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        String email = prefs.getString("userEmail", "example@gmail.com"); // Giá trị mặc định

        if (userEmail != null) {
            userEmail.setText(email);
        }
    }

    // Xử lý sự kiện Footer (Nút Home & Nút Back)
    protected void setupFooter() {
        ImageView homeButton = findViewById(R.id.homeButton);
        ImageView backButton = findViewById(R.id.backButton);

        if (homeButton != null) {
            homeButton.setOnClickListener(v -> {
                Intent intent = new Intent(BaseActivity.this, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                finish();
            });
        }

        if (backButton != null) {
            backButton.setOnClickListener(v -> onBackPressed());
        }
    }
}
