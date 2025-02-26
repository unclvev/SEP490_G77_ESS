namespace SEP490_G77_ESS.DTO.UserDTO
{
    public class RegisterDTO
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
        public DateTime? Datejoin { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public string? RePassword { get; set; }
        public string? Role { get; set; }
    }
}
