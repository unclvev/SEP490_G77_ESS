using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SEP490_G77_ESS.Models;

public partial class Section
{
    public long Secid { get; set; }

    public string? Secname { get; set; }
    
    public long? BankId { get; set; }

    [JsonIgnore]
    public virtual Bank? Bank { get; set; }
    [JsonIgnore]
    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    [JsonIgnore]
    public virtual ICollection<SectionHierarchy> SectionHierarchyAncestors { get; set; } = new List<SectionHierarchy>();
    [JsonIgnore]
    public virtual ICollection<SectionHierarchy> SectionHierarchyDescendants { get; set; } = new List<SectionHierarchy>();
}
