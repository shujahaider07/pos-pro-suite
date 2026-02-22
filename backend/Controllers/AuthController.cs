using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;

namespace PosProSuite.Api.Controllers;

public record LoginRequest(string Email, string Password, string Role);

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly PosDbContext _context;

    public AuthController(PosDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email == request.Email &&
                u.PasswordHash == request.Password &&
                u.Role == request.Role);

        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }

        return Ok(new
        {
            email = user.Email,
            role = user.Role,
            name = user.Email.Split('@')[0]
        });
    }
}
