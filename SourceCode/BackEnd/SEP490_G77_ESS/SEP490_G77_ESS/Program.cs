using APIGateWay.config;
using AspNetCoreRateLimit;
using AuthenticationService.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;
using SEP490_G77_ESS.Utils;
using Swashbuckle.AspNetCore.Filters;
using System.Text;

var builder = WebApplication.CreateBuilder(args);




builder.Services.AddOptions();
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey
    });

    options.OperationFilter<SecurityRequirementsOperationFilter>();
});
builder.Services.AddHostedService<AccountCleanupService>();
builder.Services.AddScoped<IAuthorizationHandler, ResourcePermissionHandler>();




builder.Services.AddAuthorization(options =>
{
    // === Bank ===
    options.AddPolicy("BankRead", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Bank", "Read")));
    options.AddPolicy("BankModify", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Bank", "Modify")));
    options.AddPolicy("BankDelete", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Bank", "Delete")));

    // === Exam ===
    options.AddPolicy("ExamRead", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Exam", "Read")));
    options.AddPolicy("ExamModify", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Exam", "Modify")));
    options.AddPolicy("ExamDelete", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Exam", "Delete")));

    // === Grade ===
    options.AddPolicy("GradeRead", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Grade", "Read")));
    options.AddPolicy("GradeModify", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Grade", "Modify")));
    options.AddPolicy("GradeDelete", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Grade", "Delete")));

    // === Analysis ===
    options.AddPolicy("AnalysisRead", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Analysis", "Read")));
    options.AddPolicy("AnalysisModify", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Analysis", "Modify")));
    options.AddPolicy("AnalysisDelete", policy =>
        policy.Requirements.Add(new ResourcePermissionRequirement("Analysis", "Delete")));
});


// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader());

});

builder.Services.AddDbContext<EssDbV11Context>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration.GetSection("AppSetting:Token").Value!)),
            ClockSkew = TimeSpan.Zero,
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<JWT>();
builder.Services.AddScoped<PasswordHandler>();
builder.Services.AddScoped<Email>();
builder.Services.AddScoped<EmailService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAllOrigins");

app.UseIpRateLimiting();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
