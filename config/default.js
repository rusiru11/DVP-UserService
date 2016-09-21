module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"localhost",
    "Database":"dvpdb"
  },


  "Redis":
  {
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123"

  },


  "Security":
  {
    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123"
  },


  "Host":
  {
    "resource": "cluster",
    "vdomain": "localhost",
    "domain": "localhost",
    "port": "3637",
    "version": "1.0"
  },

  "LBServer" : {

    "ip": "localhost",
    "port": "3434"

  },


  "Mongo":
  {
    "ip":"45.55.142.207",
    "port":"27017",
    "dbname":"dvpdb",
    "password":"DuoS123",
    "user":"duo"
  },

    "Services" : {
      "accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiYWEzOGRmZWYtNDFhOC00MWUyLTgwMzktOTJjZTY0YjM4ZDFmIiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE5MDIzODExMTgsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NzAzODExMTh9.AUWgOFnSFUmzu4BxXLNQML0cqgrbIj9E8zfgqHrZot4",
      "resourceServiceHost": "resourceservice.app.veery.cloud",
      "resourceServicePort": "8831",
      "resourceServiceVersion": "1.0.0.0",
      "sipuserendpointserviceHost": "sipuserendpointservice.app.veery.cloud",
      "sipuserendpointservicePort": "8831",
      "sipuserendpointserviceVersion": "1.0.0.0",
      "clusterconfigserviceHost": "clusterconfig.app.veery.cloud",
      "clusterconfigservicePort": "8831",
      "clusterconfigserviceVersion": "1.0.0.0"
    }



};