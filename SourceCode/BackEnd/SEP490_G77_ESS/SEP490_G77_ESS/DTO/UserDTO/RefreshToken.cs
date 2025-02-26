namespace SEP490_G77_ESS.DTO.UserDTO
{
    public class RefreshToken
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Created { get; set; } = DateTime.Now;

        // Gán giá trị mặc định cho Expires nếu chưa có giá trị
        public DateTime Expires { get; set; } = DateTime.Now.AddDays(7); // Thêm giá trị mặc định (thời gian hết hạn token)
    }
}
