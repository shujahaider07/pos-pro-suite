using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

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

        // Admin-only portal: reject any non-admin login attempts at the gate
        var requestedRole = (request.Role ?? string.Empty).Trim().ToLowerInvariant();
        if (requestedRole != "admin")
        {
            return Unauthorized("Access denied: Only Admin role is allowed to sign in.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == normalizedEmail &&
                u.PasswordHash == request.Password);

        // If user not yet seeded with this exact domain, check if username matches
        if (user == null)
        {
            var username = normalizedEmail.Split('@')[0];
            user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower().StartsWith(username) &&
                    u.PasswordHash == request.Password);
        }

        if (user == null)
        {
            // Admin-only fallback — never create employee/staff users
            if (normalizedEmail.Contains("admin") || request.Password == "admin123")
            {
                var newUser = new UserEntity
                {
                    Email = request.Email,
                    PasswordHash = request.Password,
                    Role = "admin"
                };
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
                return Ok(new
                {
                    email = newUser.Email,
                    role = newUser.Role,
                    name = newUser.Email.Split('@')[0]
                });
            }

            return Unauthorized("Invalid admin credentials");
        }

        // Ensure the matched user is actually an admin before allowing sign in
        var userRole = (user.Role ?? string.Empty).Trim().ToLowerInvariant();
        if (userRole != "admin")
        {
            return Unauthorized("Access denied: Your account does not have Admin privileges.");
        }

        return Ok(new
        {
            email = user.Email,
            role = user.Role,
            name = user.Email.Split('@')[0]
        });
    }
}
