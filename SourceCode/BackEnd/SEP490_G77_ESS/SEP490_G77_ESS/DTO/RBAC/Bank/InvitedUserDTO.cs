namespace SEP490_G77_ESS.DTO.RBAC.Bank
{
    public class InvitedUserDTO
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public long? BankId { get; set; }
        public long? UserId { get; set; }
        public bool? CanEdit { get; set; }
        public bool? CanView { get; set; }
    }
}
