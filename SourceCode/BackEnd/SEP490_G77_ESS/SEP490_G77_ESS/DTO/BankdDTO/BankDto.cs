namespace SEP490_G77_ESS.DTO.BankdDTO
{
    public class BankDto
    {
        public long BankId { get; set; }
        public string BankName { get; set; }
        public List<SectionDto> Sections { get; set; }
        public long? CurriculumId { get; set; }
    }
}
