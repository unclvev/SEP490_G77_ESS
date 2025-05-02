package com.example.essgrading.Activity;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.GravityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import com.example.essgrading.Activity.Authentication.LoginActivity;
import com.example.essgrading.Activity.Class.ClassListActivity;
import com.example.essgrading.Activity.Test.TestListActivity;
import com.example.essgrading.Interface.SearchHandler;
import com.example.essgrading.R;
import com.google.android.material.navigation.NavigationView;

public class BaseActivity extends AppCompatActivity {

    protected DrawerLayout drawerLayout;
    protected NavigationView navigationView;
    protected TextView headerTitle;
    protected TextView userEmail,userName; // Thêm biến cho email
    protected EditText searchInput;
    protected ImageView searchIcon;
    private BroadcastReceiver logoutReceiver;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    @Override
    protected void onResume() {
        super.onResume();
        logoutReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Toast.makeText(context, "Phiên đăng nhập đã hết hạn", Toast.LENGTH_LONG).show();
                Intent loginIntent = new Intent(context, LoginActivity.class);
                loginIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(loginIntent);
            }
        };
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            registerReceiver(logoutReceiver, new IntentFilter("com.example.essgrading.LOGOUT"), Context.RECEIVER_NOT_EXPORTED);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (logoutReceiver != null) {
            unregisterReceiver(logoutReceiver);
            logoutReceiver = null;
        }
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

        // Lấy logoutIcon từ header của navigationView
        View headerView = navigationView.getHeaderView(0);
        View logoutIcon = headerView.findViewById(R.id.logoutIcon);

        if (logoutIcon != null) {
            logoutIcon.setOnClickListener(v -> {
                Toast.makeText(BaseActivity.this, "Đã đăng xuất", Toast.LENGTH_SHORT).show();
                logoutUser();  // Đảm bảo rằng logoutUser() được gọi
            });
        }
        navigationView.setNavigationItemSelectedListener(item -> {
            int id = item.getItemId();

            if (id == R.id.menu_exam_storage) {
                // Xử lý khi người dùng chọn mục này
            } else if (id == R.id.menu_classes) {
                Intent intent = new Intent(BaseActivity.this, ClassListActivity.class);
                startActivity(intent);
            }

            drawerLayout.closeDrawer(GravityCompat.START);
            return true;
        });

        // Thiết lập listener cho menu icon
        View menuIcon = findViewById(R.id.menuIcon);
        if (menuIcon != null) {
            menuIcon.setOnClickListener(v -> {
                if (drawerLayout != null) {
                    drawerLayout.openDrawer(GravityCompat.START);
                }
            });
        }
        searchInput = findViewById(R.id.searchInput);
        searchIcon = findViewById(R.id.searchIcon);

        if (searchIcon != null) {
            searchIcon.setOnClickListener(v -> {
                if (searchInput.getVisibility() == View.GONE) {
                    searchInput.setVisibility(View.VISIBLE);
                    searchInput.requestFocus();
                } else {
                    searchInput.setText("");
                    searchInput.setVisibility(View.GONE);
                    if (this instanceof SearchHandler) {
                        ((SearchHandler) this).onSearchTextChanged(""); // Reset lại data khi ẩn search
                    }
                }
            });
        }

        if (searchInput != null) {
            searchInput.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    if (BaseActivity.this instanceof SearchHandler) {
                        ((SearchHandler) BaseActivity.this).onSearchTextChanged(s.toString());
                    }
                }

                @Override
                public void afterTextChanged(Editable s) {}
            });
        }

        headerTitle = findViewById(R.id.headerTitle);
        searchInput = findViewById(R.id.searchInput);
        searchIcon = findViewById(R.id.searchIcon);

        if (searchIcon != null) {
            searchIcon.setOnClickListener(v -> {
                if (searchInput.getVisibility() == View.GONE) {
                    searchInput.setVisibility(View.VISIBLE);
                    headerTitle.setVisibility(View.GONE);  // Ẩn tiêu đề
                    searchInput.requestFocus();
                } else {
                    searchInput.setText(""); // Clear nội dung tìm kiếm
                    searchInput.setVisibility(View.GONE);
                    headerTitle.setVisibility(View.VISIBLE);  // Hiện lại tiêu đề
                    if (this instanceof SearchHandler) {
                        ((SearchHandler) this).onSearchTextChanged("");
                    }
                }
            });
        }

        drawerLayout.addDrawerListener(new ActionBarDrawerToggle(
                this, drawerLayout, R.string.open_drawer, R.string.close_drawer));

        // Xử lý sự kiện cho Footer
        setupFooter();
    }

    private void logoutUser() {
        // Xóa token khỏi SharedPreferences
        SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.remove("jwtToken"); // Xóa token
        editor.apply();

        // Chuyển về trang đăng nhập
        Intent intent = new Intent(BaseActivity.this, LoginActivity.class);
        startActivity(intent);
        finish(); // Kết thúc Activity hiện tại để người dùng không quay lại được
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
        userName = headerView.findViewById(R.id.userName);

        SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
        String email = prefs.getString("userEmail", "Không lấy được email");
        String username = prefs.getString("userName", "Không lấy được tên");

        if (userEmail != null) {
            userEmail.setText(email);
        }
        if (userName != null) {
            userName.setText(username);
        }
    }
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
