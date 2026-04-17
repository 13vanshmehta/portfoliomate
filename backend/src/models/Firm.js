class Firm {
  constructor(data) {
    this.firmId = data.firmId;
    this.firmName = data.firmName;
    this.firmEmailId = data.firmEmailId;
    this.description = data.description;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      firmId: this.firmId,
      firmName: this.firmName,
      firmEmailId: this.firmEmailId,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Firm;