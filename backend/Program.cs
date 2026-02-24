using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PosDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(origin => true) // This allows ANY origin
              .AllowCredentials();
    });
});

//builder.Services.AddCors(options =>
//{
//    options.AddDefaultPolicy(policy =>
//    {
//        policy.AllowAnyHeader()
//            .AllowAnyMethod()
//            .AllowCredentials()
//            .WithOrigins(
//                "http://localhost:5173",
//                "http://localhost:4173",
//                "http://localhost:8080"
//            );
//    });
//});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
    await DbSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// For local HTTP dev (http://localhost:5000) we do not redirect to HTTPS,
// so that Vite dev server can call APIs without 307 redirects.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.MapControllers();

app.Run();
