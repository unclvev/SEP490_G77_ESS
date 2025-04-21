namespace SEP490_G77_ESS.DTO.RBAC.Bank
{
    public class AccessRoleDto
    {
        public string? RoleName { get; set; }
        public bool? CanModify { get; set; }
        public bool? CanRead { get; set; }
        public bool? CanDelete { get; set; }
    }
}
