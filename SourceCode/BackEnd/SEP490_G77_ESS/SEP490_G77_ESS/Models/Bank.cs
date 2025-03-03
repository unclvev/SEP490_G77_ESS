using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SEP490_G77_ESS.Models;

public partial class Bank
{
    public long BankId { get; set; }

    public string? Bankname { get; set; }

    public byte? Bankstatus { get; set; }

    public long? Totalquestion { get; set; }
    [JsonIgnore]
    public long? Accid { get; set; }

    public long? GradeId { get; set; }

    public long? SubjectId { get; set; }

    public DateTime? CreateDate { get; set; }
    [JsonIgnore]
    public virtual Account? Acc { get; set; }
    [JsonIgnore]
    public virtual ICollection<BankAccess> BankAccesses { get; set; } = new List<BankAccess>();
    [JsonIgnore]
    public virtual Grade? Grade { get; set; }

    public virtual ICollection<Section> Sections { get; set; } = new List<Section>();
    [JsonIgnore]
    public virtual Subject? Subject { get; set; }
}
