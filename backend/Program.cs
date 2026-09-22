using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// =====================================================
// Database
// =====================================================

builder.Services.AddDbContext<PosDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// =====================================================
// Controllers
// =====================================================

builder.Services.AddControllers();

// =====================================================
// Swagger
// =====================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// =====================================================
// CORS
// =====================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// =====================================================
// Database Seeder
// =====================================================

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();

    await DbSeeder.SeedAsync(db);
}

// =====================================================
// Swagger
// =====================================================

app.UseSwagger();

app.UseSwaggerUI();

// =====================================================
// Automatically Open Swagger
// =====================================================

app.Lifetime.ApplicationStarted.Register(() =>
{
    var url = app.Urls.FirstOrDefault();

    if (!string.IsNullOrEmpty(url))
    {
        var swaggerUrl = $"{url.TrimEnd('/')}/swagger";

        System.Diagnostics.Process.Start(
            new System.Diagnostics.ProcessStartInfo
            {
                FileName = swaggerUrl,
                UseShellExecute = true
            }
        );
    }
});

// =====================================================
// HTTPS redirection
// =====================================================

//if (!app.Environment.IsDevelopment())
//{
    app.UseHttpsRedirection();
//}

// =====================================================
// Controllers
// =====================================================

app.MapControllers();

// =====================================================
// Run
// =====================================================

app.Run();