package com.example.essgrading.Utils;

import android.content.Context;
import android.util.AttributeSet;
import android.view.SurfaceView;

public class AutoFitSurfaceView extends SurfaceView {
    private int ratioWidth = 0;
    private int ratioHeight = 0;

    public AutoFitSurfaceView(Context context) {
        super(context);
    }
    public AutoFitSurfaceView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    /**
     * Thiết lập tỉ lệ khung hình: ratioWidth : ratioHeight
     */
    public void setAspectRatio(int width, int height) {
        if (width < 0 || height < 0) throw new IllegalArgumentException("Size cannot be negative.");
        ratioWidth = width;
        ratioHeight = height;
        requestLayout();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width  = MeasureSpec.getSize(widthMeasureSpec);
        int height = MeasureSpec.getSize(heightMeasureSpec);
        if (ratioWidth == 0 || ratioHeight == 0) {
            setMeasuredDimension(width, height);
        } else {
            // so sánh width/height với ratioWidth/ratioHeight để fit vào đúng tỉ lệ
            if (width * ratioHeight < height * ratioWidth) {
                setMeasuredDimension(width, width * ratioHeight / ratioWidth);
            } else {
                setMeasuredDimension(height * ratioWidth / ratioHeight, height);
            }
        }
    }
}
