namespace SEP490_G77_ESS.DTO.UserDTO
{
    public class ResetPasswordRequest
    {
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }
}
