package com.example.essgrading.Utils;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;

public class OverlayView extends View {
    private Paint paint;
    private float ratio = 1f; // default

    public OverlayView(Context context) {
        super(context);
        init();
    }
    public OverlayView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }
    private void init() {
        paint = new Paint();
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(5);
        paint.setColor(0xAAFFFFFF); // bán trong suốt trắng
    }

    /** Gọi từ Activity để set tỉ lệ height/width của khung */
    public void setRatio(float ratio) {
        this.ratio = ratio;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int w = getWidth();
        int h = getHeight();
        int rectW, rectH;
        // nếu chiều cao ảnh > w * ratio thì giới hạn theo chiều rộng
        if (h > w * ratio) {
            rectW = w;
            rectH = Math.round(w * ratio);
        } else {
            rectH = h;
            rectW = Math.round(h / ratio);
        }

        int left = (w - rectW) / 2;
        int top  = (h - rectH) / 2;
        canvas.drawRect(left, top, left + rectW, top + rectH, paint);
    }
}
