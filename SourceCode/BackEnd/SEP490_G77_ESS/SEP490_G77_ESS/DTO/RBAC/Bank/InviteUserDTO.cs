namespace SEP490_G77_ESS.DTO.RBAC.Bank
{
    public class InviteUserDTO
    {
        public long BankId { get; set; }
        public long UserId { get; set; }
        public bool CanEdit { get; set; }
        public bool CanView { get; set; }
    }
}
