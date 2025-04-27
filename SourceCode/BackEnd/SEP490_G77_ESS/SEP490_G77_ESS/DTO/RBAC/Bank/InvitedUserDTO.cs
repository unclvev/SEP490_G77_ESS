namespace SEP490_G77_ESS.DTO.RBAC.Bank
{
    public class InvitedUserDTO
    {
        public string RoleName { get; set; }
        public string ResourceType { get; set; }
        public long ResourceId { get; set; }
        public long Accid { get; set; }
        public bool CanModify { get; set; }
        public bool CanRead { get; set; }
        public bool CanDelete { get; set; }

    }
}
