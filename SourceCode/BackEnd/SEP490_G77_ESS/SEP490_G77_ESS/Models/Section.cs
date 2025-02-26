using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Section
{
    public long Secid { get; set; }

    public string? Secname { get; set; }

    public long? BankId { get; set; }

    public virtual Bank? Bank { get; set; }

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();

    public virtual ICollection<SectionHierarchy> SectionHierarchyAncestors { get; set; } = new List<SectionHierarchy>();

    public virtual ICollection<SectionHierarchy> SectionHierarchyDescendants { get; set; } = new List<SectionHierarchy>();
}
