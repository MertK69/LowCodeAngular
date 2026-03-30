from sqlalchemy import Column, Integer, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from components.core.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    inquiryId = Column(String, unique=True, index=True)
    createdAt = Column(String)
    firstName = Column(String)
    lastName = Column(String)
    email = Column(String)
    street = Column(String)
    houseNumber = Column(String)
    address = Column(String)
    postalCode = Column(String)
    city = Column(String)
    employer = Column(String)
    employerVatId = Column(String)
    employedSince = Column(String)
    monthlyNetIncome = Column(Float)
    iban = Column(String)
    loanType = Column(String)
    loanAmount = Column(Float)
    termMonths = Column(Integer)
    purpose = Column(String)
    department = Column(String)
    routeMessage = Column(String)
    supportedInPhaseOne = Column(Boolean)
    futurePhase = Column(Boolean)
    invalidProductRange = Column(Boolean)
    completenessStatus = Column(String)
    scoringStatus = Column(String)
    score = Column(Integer, nullable=True)
    riskClass = Column(String)
    teamleadRequired = Column(Boolean)
    teamleadDecision = Column(String)
    rateCalculationStatus = Column(String)
    interestRate = Column(Float, nullable=True)
    monthlyRate = Column(Float, nullable=True)
    offerStatus = Column(String)
    documentStatus = Column(String)
    signatureStatus = Column(String)
    mailStatus = Column(String)
    archiveStatus = Column(String)
    overallStatus = Column(String)
    currentOwner = Column(String)
    
    # Store complex nested data as JSON for simplicity in this prototype
    documents = Column(JSON) 
    integration = Column(JSON)
    
    logs = relationship("LogEntry", back_populates="application", cascade="all, delete-orphan")

class LogEntry(Base):
    __tablename__ = "logs"

    id = Column(String, primary_key=True)
    recordId = Column(Integer, ForeignKey("applications.id"))
    inquiryId = Column(String)
    interfaceName = Column(String)
    message = Column(String)
    status = Column(String)
    timestamp = Column(String)

    application = relationship("Application", back_populates="logs")
